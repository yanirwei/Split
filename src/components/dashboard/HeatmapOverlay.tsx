"use client";

import React, { useRef, useEffect } from "react";

interface HeatmapPoint {
  x: number;
  y: number;
  elementType?: string;
}

interface HeatmapOverlayProps {
  points: HeatmapPoint[];
  width: number;
  height: number;
}

export default function HeatmapOverlay({ points, width, height }: HeatmapOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || points.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw heatmap points
    points.forEach((point) => {
      const x = (point.x / 100) * width;
      const y = (point.y / 100) * height;

      // Create radial gradient for each point
      const radius = 20;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, "rgba(255, 0, 0, 0.6)");
      gradient.addColorStop(0.4, "rgba(255, 165, 0, 0.3)");
      gradient.addColorStop(1, "rgba(255, 255, 0, 0)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Apply colorize effect
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha > 0) {
        // Map intensity to heatmap colors (blue -> green -> yellow -> red)
        const intensity = alpha / 255;
        if (intensity < 0.25) {
          data[i] = 0; // R
          data[i + 1] = Math.round(intensity * 4 * 255); // G
          data[i + 2] = 255; // B
        } else if (intensity < 0.5) {
          data[i] = 0;
          data[i + 1] = 255;
          data[i + 2] = Math.round((1 - (intensity - 0.25) * 4) * 255);
        } else if (intensity < 0.75) {
          data[i] = Math.round((intensity - 0.5) * 4 * 255);
          data[i + 1] = 255;
          data[i + 2] = 0;
        } else {
          data[i] = 255;
          data[i + 1] = Math.round((1 - (intensity - 0.75) * 4) * 255);
          data[i + 2] = 0;
        }
        data[i + 3] = Math.min(alpha * 2, 180); // Adjust opacity
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [points, width, height]);

  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        No heatmap data yet
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 pointer-events-none"
      style={{ width, height }}
    />
  );
}
