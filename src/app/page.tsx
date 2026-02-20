"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Variation {
  id: string;
  name: string;
  isControl: boolean;
  views: number;
  installs: number;
}

interface Experiment {
  id: string;
  name: string;
  description?: string;
  status: string;
  testingElement: string;
  trafficSplit: string;
  startDate?: string;
  createdAt: string;
  app: {
    name: string;
    storeType: string;
    developer: string;
  };
  variations: Variation[];
}

export default function Dashboard() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/experiments")
      .then((res) => res.json())
      .then(setExperiments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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

  const getConversionRate = (v: Variation) => {
    if (v.views === 0) return "0.0%";
    return `${((v.installs / v.views) * 100).toFixed(1)}%`;
  };

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/experiments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    // Refresh
    const res = await fetch("/api/experiments");
    setExperiments(await res.json());
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Manage your App Store & Google Play A/B tests
          </p>
        </div>
        <Link href="/experiments/new" className="btn-primary">
          + New Experiment
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : experiments.length === 0 ? (
        <div className="card text-center py-16">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            No experiments yet
          </h3>
          <p className="text-gray-500 mb-6">
            Create your first A/B test to start optimizing your app store pages.
          </p>
          <Link href="/experiments/new" className="btn-primary">
            Create First Experiment
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {experiments.map((exp) => {
            const totalViews = exp.variations.reduce((s, v) => s + v.views, 0);
            const totalInstalls = exp.variations.reduce(
              (s, v) => s + v.installs,
              0
            );
            const overallCR =
              totalViews > 0
                ? ((totalInstalls / totalViews) * 100).toFixed(1)
                : "0.0";

            return (
              <div key={exp.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Link
                        href={`/experiments/${exp.id}`}
                        className="text-xl font-semibold text-gray-900 hover:text-blue-600"
                      >
                        {exp.name}
                      </Link>
                      {getStatusBadge(exp.status)}
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                        {exp.app.storeType === "ios" ? "iOS App Store" : "Google Play"}
                      </span>
                    </div>
                    {exp.description && (
                      <p className="text-sm text-gray-500 mb-3">{exp.description}</p>
                    )}
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <span>
                        App: <strong>{exp.app.name}</strong>
                      </span>
                      <span>
                        Testing: <strong>{exp.testingElement}</strong>
                      </span>
                      <span>
                        Split: <strong>{exp.trafficSplit}</strong>
                      </span>
                      <span>
                        Variations: <strong>{exp.variations.length}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {exp.status === "draft" && (
                      <button
                        onClick={() => handleStatusChange(exp.id, "running")}
                        className="btn-success text-sm"
                      >
                        Start
                      </button>
                    )}
                    {exp.status === "running" && (
                      <button
                        onClick={() => handleStatusChange(exp.id, "paused")}
                        className="btn-secondary text-sm"
                      >
                        Pause
                      </button>
                    )}
                    {exp.status === "paused" && (
                      <button
                        onClick={() => handleStatusChange(exp.id, "running")}
                        className="btn-success text-sm"
                      >
                        Resume
                      </button>
                    )}
                    {(exp.status === "running" || exp.status === "paused") && (
                      <button
                        onClick={() => handleStatusChange(exp.id, "completed")}
                        className="btn-secondary text-sm"
                      >
                        Complete
                      </button>
                    )}
                    <Link
                      href={`/experiments/${exp.id}`}
                      className="btn-primary text-sm"
                    >
                      View Results
                    </Link>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Total Views</p>
                    <p className="text-2xl font-bold text-gray-900">{totalViews.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Total Installs</p>
                    <p className="text-2xl font-bold text-gray-900">{totalInstalls.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Conversion Rate</p>
                    <p className="text-2xl font-bold text-blue-600">{overallCR}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Per Variation</p>
                    <div className="flex gap-3 mt-1">
                      {exp.variations.map((v) => (
                        <div key={v.id} className="text-xs">
                          <span className={`font-medium ${v.isControl ? "text-gray-700" : "text-blue-600"}`}>
                            {v.name}:
                          </span>{" "}
                          {getConversionRate(v)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
