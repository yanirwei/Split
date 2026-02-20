"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import HeatmapOverlay from "@/components/dashboard/HeatmapOverlay";
import {
  ConversionBarChart,
  ViewsInstallsChart,
  InstallerBehaviorChart,
} from "@/components/dashboard/ConversionChart";

interface VariationAnalytics {
  variationId: string;
  variationName: string;
  isControl: boolean;
  views: number;
  installs: number;
  conversionRate: number;
  confidenceInterval: { lower: number; upper: number };
  visitors: number;
  installers: number;
  decisiveInstallers: number;
  exploratoryInstallers: number;
  droppers: number;
  decisiveDroppers: number;
  exploratoryDroppers: number;
  avgTimeOnPage: number;
  galleryScrollEvents: number;
  pageScrollEvents: number;
  videoPlays: number;
  avgVideoWatchTime: number;
  heatmapPoints: { x: number; y: number; elementType?: string }[];
  significance?: { zScore: number; pValue: number; isSignificant: boolean } | null;
  lift?: number;
}

interface AnalyticsData {
  experiment: {
    id: string;
    name: string;
    status: string;
    testingElement: string;
    confidenceLevel: number;
    startDate?: string;
    endDate?: string;
    app: {
      name: string;
      storeType: string;
      developer: string;
    };
  };
  control: VariationAnalytics | null;
  variants: VariationAnalytics[];
  totalViews: number;
  totalInstalls: number;
  overallConversionRate: number;
}

export default function ExperimentDetail() {
  const params = useParams();
  const experimentId = params.id as string;
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "behavior" | "heatmap">("overview");
  const [selectedHeatmapVariation, setSelectedHeatmapVariation] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/analytics/${experimentId}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        if (d.control) setSelectedHeatmapVariation(d.control.variationId);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [experimentId]);

  const handleStatusChange = async (status: string) => {
    await fetch(`/api/experiments/${experimentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    // Refresh data
    const res = await fetch(`/api/analytics/${experimentId}`);
    setData(await res.json());
  };

  const copyTestLink = () => {
    const link = `${window.location.origin}/api/experiments/${experimentId}/redirect`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-gray-500">Experiment not found</p>;
  }

  const allVariations = [
    ...(data.control ? [data.control] : []),
    ...data.variants,
  ];

  const winner = data.variants.find(
    (v) => v.significance?.isSignificant && v.lift && v.lift > 0
  );

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      draft: "badge-draft",
      running: "badge-running",
      paused: "badge-paused",
      completed: "badge-completed",
    };
    return (
      <span className={classes[status] || "badge-draft"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm">
              Dashboard
            </Link>
            <span className="text-gray-400">/</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{data.experiment.name}</h1>
            {getStatusBadge(data.experiment.status)}
          </div>
          <p className="text-gray-500 mt-1">
            {data.experiment.app.name} - {data.experiment.app.storeType === "ios" ? "iOS App Store" : "Google Play"} - Testing: {data.experiment.testingElement}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={copyTestLink} className="btn-secondary text-sm">
            {copied ? "Copied!" : "Copy Test Link"}
          </button>
          {data.experiment.status === "draft" && (
            <button onClick={() => handleStatusChange("running")} className="btn-success text-sm">
              Start Experiment
            </button>
          )}
          {data.experiment.status === "running" && (
            <>
              <button onClick={() => handleStatusChange("paused")} className="btn-secondary text-sm">
                Pause
              </button>
              <button onClick={() => handleStatusChange("completed")} className="btn-primary text-sm">
                Complete
              </button>
            </>
          )}
          {data.experiment.status === "paused" && (
            <button onClick={() => handleStatusChange("running")} className="btn-success text-sm">
              Resume
            </button>
          )}
        </div>
      </div>

      {/* Test Link Info */}
      <div className="card mb-6 bg-blue-50 border-blue-200">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-900">Share this link to split traffic between variations:</p>
            <code className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded mt-1 inline-block">
              {typeof window !== "undefined" ? `${window.location.origin}/api/experiments/${experimentId}/redirect` : `/api/experiments/${experimentId}/redirect`}
            </code>
          </div>
        </div>
        <p className="text-xs text-blue-600 mt-2">
          Use this URL in your Facebook ads, campaigns, or any traffic source. Visitors will be automatically split between variations.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Views</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{data.totalViews.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Installs</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{data.totalInstalls.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Overall CVR</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{data.overallConversionRate.toFixed(2)}%</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Winner</p>
          {winner ? (
            <p className="text-lg font-bold text-green-600 mt-1">
              {winner.variationName} (+{winner.lift?.toFixed(1)}%)
            </p>
          ) : (
            <p className="text-sm text-gray-400 mt-2">Not yet determined</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-6">
          {[
            { key: "overview", label: "Overview" },
            { key: "behavior", label: "User Behavior" },
            { key: "heatmap", label: "Heatmap" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Conversion Rate Comparison */}
          <div className="grid grid-cols-2 gap-6">
            <div className="card">
              <ConversionBarChart variations={allVariations} />
            </div>
            <div className="card">
              <ViewsInstallsChart variations={allVariations} />
            </div>
          </div>

          {/* Per-Variation Details */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Variation Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-medium text-gray-500">Variation</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-500">Views</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-500">Installs</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-500">CVR</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-500">95% CI</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-500">Lift</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-500">p-value</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-500">Significant</th>
                  </tr>
                </thead>
                <tbody>
                  {allVariations.map((v) => (
                    <tr key={v.variationId} className="border-b border-gray-100">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{v.variationName}</span>
                          {v.isControl && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                              Control
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-right py-3 px-2">{v.views.toLocaleString()}</td>
                      <td className="text-right py-3 px-2">{v.installs.toLocaleString()}</td>
                      <td className="text-right py-3 px-2 font-semibold">{v.conversionRate.toFixed(2)}%</td>
                      <td className="text-right py-3 px-2 text-xs text-gray-500">
                        {v.confidenceInterval.lower.toFixed(2)}% - {v.confidenceInterval.upper.toFixed(2)}%
                      </td>
                      <td className={`text-right py-3 px-2 font-medium ${
                        v.lift && v.lift > 0 ? "text-green-600" : v.lift && v.lift < 0 ? "text-red-600" : ""
                      }`}>
                        {v.isControl ? "-" : `${(v.lift || 0) > 0 ? "+" : ""}${(v.lift || 0).toFixed(1)}%`}
                      </td>
                      <td className="text-right py-3 px-2 text-xs">
                        {v.significance ? v.significance.pValue.toFixed(4) : "-"}
                      </td>
                      <td className="text-right py-3 px-2">
                        {v.significance ? (
                          v.significance.isSignificant ? (
                            <span className="text-green-600 font-medium">Yes</span>
                          ) : (
                            <span className="text-gray-400">No</span>
                          )
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Preview Links */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Preview Variations</h3>
            <div className="grid grid-cols-2 gap-4">
              {allVariations.map((v) => (
                <Link
                  key={v.variationId}
                  href={`/preview/${v.variationId}`}
                  target="_blank"
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{v.variationName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Click to preview mock store page</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Behavior Tab */}
      {activeTab === "behavior" && (
        <div className="space-y-6">
          {/* Decisive vs Exploratory */}
          <div className="grid grid-cols-2 gap-6">
            <div className="card">
              <InstallerBehaviorChart variations={allVariations} />
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Behavior Summary</h3>
              <div className="space-y-4">
                {allVariations.map((v) => (
                  <div key={v.variationId} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900 mb-2">{v.variationName}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Decisive Installers:</span>{" "}
                        <span className="font-medium text-green-600">{v.decisiveInstallers}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Exploratory Installers:</span>{" "}
                        <span className="font-medium text-blue-600">{v.exploratoryInstallers}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Decisive Droppers:</span>{" "}
                        <span className="font-medium text-red-600">{v.decisiveDroppers}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Exploratory Droppers:</span>{" "}
                        <span className="font-medium text-orange-600">{v.exploratoryDroppers}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Engagement Metrics */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Engagement Metrics</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-medium text-gray-500">Variation</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-500">Avg Time on Page</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-500">Gallery Scrolls</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-500">Page Scrolls</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-500">Video Plays</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-500">Avg Video Watch</th>
                  </tr>
                </thead>
                <tbody>
                  {allVariations.map((v) => (
                    <tr key={v.variationId} className="border-b border-gray-100">
                      <td className="py-3 px-2 font-medium">{v.variationName}</td>
                      <td className="text-right py-3 px-2">{v.avgTimeOnPage.toFixed(1)}s</td>
                      <td className="text-right py-3 px-2">{v.galleryScrollEvents}</td>
                      <td className="text-right py-3 px-2">{v.pageScrollEvents}</td>
                      <td className="text-right py-3 px-2">{v.videoPlays}</td>
                      <td className="text-right py-3 px-2">{v.avgVideoWatchTime.toFixed(1)}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Funnel */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Conversion Funnel</h3>
            <div className="grid grid-cols-1 gap-4">
              {allVariations.map((v) => {
                const viewWidth = 100;
                const installWidth = v.views > 0 ? (v.installs / v.views) * 100 : 0;
                return (
                  <div key={v.variationId} className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900 mb-3">{v.variationName}</p>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Page Views</span>
                          <span>{v.views.toLocaleString()}</span>
                        </div>
                        <div className="h-6 bg-blue-200 rounded" style={{ width: `${viewWidth}%` }}>
                          <div className="h-full bg-blue-500 rounded flex items-center px-2 text-xs text-white font-medium">
                            100%
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Install Clicks</span>
                          <span>{v.installs.toLocaleString()}</span>
                        </div>
                        <div className="h-6 bg-gray-200 rounded" style={{ width: `${viewWidth}%` }}>
                          <div
                            className="h-full bg-green-500 rounded flex items-center px-2 text-xs text-white font-medium"
                            style={{ width: `${Math.max(installWidth, 2)}%` }}
                          >
                            {installWidth > 8 ? `${installWidth.toFixed(1)}%` : ""}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Heatmap Tab */}
      {activeTab === "heatmap" && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Click Heatmap</h3>
              <select
                className="input-field w-auto"
                value={selectedHeatmapVariation}
                onChange={(e) => setSelectedHeatmapVariation(e.target.value)}
              >
                {allVariations.map((v) => (
                  <option key={v.variationId} value={v.variationId}>
                    {v.variationName}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative bg-gray-100 rounded-lg overflow-hidden mx-auto" style={{ width: 430, height: 700 }}>
              {/* Mock store page background */}
              <div className="absolute inset-0 bg-white">
                <div className="p-5">
                  <div className="flex gap-4 mb-4">
                    <div className="w-[80px] h-[80px] rounded-2xl bg-gray-200" />
                    <div className="flex-1 space-y-2 pt-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-8 bg-blue-100 rounded-full w-20 mt-2" />
                    </div>
                  </div>
                  <div className="h-px bg-gray-200 mb-4" />
                  <div className="flex gap-2 mb-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-[120px] h-[220px] rounded-lg bg-gray-200" />
                    ))}
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                  </div>
                </div>
              </div>
              {/* Heatmap overlay */}
              <HeatmapOverlay
                points={
                  allVariations.find((v) => v.variationId === selectedHeatmapVariation)
                    ?.heatmapPoints || []
                }
                width={430}
                height={700}
              />
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Click intensity shown from cool (blue) to hot (red). Based on {
                allVariations.find((v) => v.variationId === selectedHeatmapVariation)?.heatmapPoints.length || 0
              } tracked clicks.
            </p>
          </div>

          {/* Click Distribution by Element */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Click Distribution by Element</h3>
            {allVariations.map((v) => {
              const elementCounts: Record<string, number> = {};
              v.heatmapPoints.forEach((p) => {
                const el = p.elementType || "unknown";
                elementCounts[el] = (elementCounts[el] || 0) + 1;
              });
              const total = v.heatmapPoints.length;
              const sorted = Object.entries(elementCounts).sort(([, a], [, b]) => b - a);

              return (
                <div key={v.variationId} className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900 mb-2">{v.variationName}</p>
                  {sorted.length > 0 ? (
                    <div className="space-y-1">
                      {sorted.map(([element, count]) => (
                        <div key={element} className="flex items-center gap-2 text-sm">
                          <span className="w-32 text-gray-600 truncate">{element}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-4">
                            <div
                              className="bg-blue-500 h-4 rounded-full"
                              style={{ width: `${(count / total) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-16 text-right">
                            {count} ({((count / total) * 100).toFixed(0)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No click data yet</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
