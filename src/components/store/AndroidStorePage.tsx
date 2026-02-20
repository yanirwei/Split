"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { trackEvent, trackHeatmapClick, getOrCreateVisitorId, initFacebookPixel, fireFacebookEvent } from "@/lib/tracking";

interface AndroidStorePageProps {
  variationId: string;
  title: string;
  developer: string;
  iconUrl?: string;
  rating: number;
  reviewCount: number;
  appSize?: string;
  screenshotUrls?: string[];
  shortDescription?: string;
  description?: string;
  category?: string;
  fbPixelId?: string;
}

export default function AndroidStorePage({
  variationId,
  title,
  developer,
  iconUrl,
  rating,
  reviewCount,
  appSize,
  screenshotUrls = [],
  shortDescription,
  description,
  category,
  fbPixelId,
}: AndroidStorePageProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const [visitorId, setVisitorId] = useState("");
  const [pageLoadTime] = useState(Date.now());
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    const vid = getOrCreateVisitorId();
    setVisitorId(vid);

    if (fbPixelId) {
      initFacebookPixel(fbPixelId);
    }

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

    if (fbPixelId) {
      fireFacebookEvent("Lead", { content_name: title, value: 1 });
    }

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

  const formatReviewCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatDownloads = (count: number) => {
    if (count >= 1000000000) return `${(count / 1000000000).toFixed(0)}B+`;
    if (count >= 1000000) return `${(count / 1000000).toFixed(0)}M+`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K+`;
    return `${count}+`;
  };

  const renderStars = (r: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const filled = i <= Math.floor(r);
      const half = !filled && i === Math.ceil(r) && r % 1 >= 0.25;
      stars.push(
        <svg
          key={i}
          className={`w-3 h-3 ${filled || half ? "text-play-green" : "text-gray-300"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    return stars;
  };

  return (
    <div
      ref={pageRef}
      onClick={handleClick}
      className="max-w-[430px] mx-auto bg-white min-h-screen font-['Roboto',sans-serif]"
    >
      {/* Android Status Bar */}
      <div className="bg-white px-4 pt-2 pb-1 flex justify-between items-center text-sm">
        <span className="text-gray-700">9:41</span>
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
          </svg>
          <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z" />
          </svg>
        </div>
      </div>

      {/* Google Play Toolbar */}
      <div className="px-4 py-3 flex items-center gap-4">
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <div className="flex-1" />
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </div>

      {/* App Header */}
      <div className="px-5 py-3">
        <div className="flex gap-4 items-start">
          {/* App Icon */}
          <div
            data-track-element="icon"
            className="w-[72px] h-[72px] rounded-2xl overflow-hidden bg-gradient-to-br from-green-400 to-green-600 flex-shrink-0"
          >
            {iconUrl ? (
              <img src={iconUrl} alt={title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                {title.charAt(0)}
              </div>
            )}
          </div>

          {/* App Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-normal text-gray-900 leading-tight" data-track-element="title">
              {title}
            </h1>
            <p className="text-sm text-play-green mt-1 font-medium" data-track-element="developer">
              {developer}
            </p>
            {category && (
              <p className="text-xs text-gray-500 mt-0.5">{category}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-5 py-3 flex items-center gap-6 text-sm">
        <div className="flex items-center gap-1" data-track-element="rating">
          <span className="font-medium text-gray-700">{rating.toFixed(1)}</span>
          <div className="flex">{renderStars(rating)}</div>
        </div>
        <div className="text-gray-500" data-track-element="reviews">
          {formatReviewCount(reviewCount)} reviews
        </div>
        <div className="text-gray-500" data-track-element="downloads">
          {formatDownloads(reviewCount * 10)} downloads
        </div>
        {appSize && (
          <div className="text-gray-500" data-track-element="size">
            {appSize}
          </div>
        )}
      </div>

      {/* Install Button */}
      <div className="px-5 py-3">
        <button
          onClick={handleInstallClick}
          data-track-element="install-button"
          className="w-full bg-play-green text-white font-medium text-sm py-3 rounded-lg hover:bg-green-700 transition-colors"
        >
          Install
        </button>
      </div>

      {/* Screenshots Gallery */}
      <div className="py-4">
        <div
          ref={galleryRef}
          onScroll={handleGalleryScroll}
          className="flex gap-2 overflow-x-auto px-5"
          data-track-element="gallery"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {screenshotUrls.map((url, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 w-[160px] h-[284px] rounded-lg overflow-hidden bg-gray-100"
              data-track-element={`screenshot-${idx}`}
            >
              <img
                src={url}
                alt={`Screenshot ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          {screenshotUrls.length === 0 && (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[160px] h-[284px] rounded-lg bg-gradient-to-b from-green-50 to-green-100 flex items-center justify-center"
                >
                  <span className="text-gray-400 text-xs">Screenshot {i}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* About this app */}
      <div className="px-5 py-4" data-track-element="description">
        <h3 className="text-lg font-medium text-gray-900 mb-2">About this app</h3>
        {shortDescription && (
          <p className="text-sm text-gray-700 mb-2 font-medium">{shortDescription}</p>
        )}
        <div className={`text-sm text-gray-600 leading-relaxed ${!showFullDescription ? "line-clamp-4" : ""}`}>
          {description || "No description available."}
        </div>
        {description && description.length > 200 && (
          <button
            onClick={() => setShowFullDescription(!showFullDescription)}
            className="text-play-green text-sm font-medium mt-2 flex items-center gap-1"
          >
            {showFullDescription ? "Show less" : "Show more"}
            <svg
              className={`w-4 h-4 transition-transform ${showFullDescription ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Ratings & Reviews */}
      <div className="px-5 py-4 border-t border-gray-100" data-track-element="reviews-section">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Ratings and reviews</h3>
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex gap-6">
          <div className="text-center">
            <p className="text-5xl font-normal text-gray-900">{rating.toFixed(1)}</p>
            <div className="flex justify-center mt-1">{renderStars(rating)}</div>
            <p className="text-xs text-gray-500 mt-1">{formatReviewCount(reviewCount)}</p>
          </div>
          <div className="flex-1 space-y-1 pt-1">
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-2">{star}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-play-green h-2.5 rounded-full"
                    style={{
                      width: `${star === 5 ? 65 : star === 4 ? 22 : star === 3 ? 7 : star === 2 ? 3 : 3}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
