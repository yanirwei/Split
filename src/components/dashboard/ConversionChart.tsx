"use client";

import React from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface VariationData {
  variationName: string;
  isControl: boolean;
  views: number;
  installs: number;
  conversionRate: number;
  decisiveInstallers: number;
  exploratoryInstallers: number;
  decisiveDroppers: number;
  exploratoryDroppers: number;
  galleryScrollEvents: number;
  pageScrollEvents: number;
  videoPlays: number;
  avgVideoWatchTime: number;
  avgTimeOnPage: number;
}

interface ConversionChartProps {
  variations: VariationData[];
}

export function ConversionBarChart({ variations }: ConversionChartProps) {
  const data = {
    labels: variations.map((v) => v.variationName),
    datasets: [
      {
        label: "Conversion Rate (%)",
        data: variations.map((v) => v.conversionRate),
        backgroundColor: variations.map((v) =>
          v.isControl ? "rgba(107, 114, 128, 0.8)" : "rgba(59, 130, 246, 0.8)"
        ),
        borderColor: variations.map((v) =>
          v.isControl ? "rgb(107, 114, 128)" : "rgb(59, 130, 246)"
        ),
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: "Conversion Rate by Variation" },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: (value: number | string) => `${value}%` },
      },
    },
  };

  return <Bar data={data} options={options} />;
}

export function ViewsInstallsChart({ variations }: ConversionChartProps) {
  const data = {
    labels: variations.map((v) => v.variationName),
    datasets: [
      {
        label: "Views",
        data: variations.map((v) => v.views),
        backgroundColor: "rgba(59, 130, 246, 0.6)",
        borderRadius: 6,
      },
      {
        label: "Installs",
        data: variations.map((v) => v.installs),
        backgroundColor: "rgba(34, 197, 94, 0.6)",
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Views vs Installs" },
    },
  };

  return <Bar data={data} options={options} />;
}

export function InstallerBehaviorChart({ variations }: { variations: VariationData[] }) {
  if (variations.length === 0) return null;

  // Aggregate across all variations for a summary
  const totalDecisive = variations.reduce((s, v) => s + v.decisiveInstallers, 0);
  const totalExploratory = variations.reduce((s, v) => s + v.exploratoryInstallers, 0);
  const totalDecisiveDroppers = variations.reduce((s, v) => s + v.decisiveDroppers, 0);
  const totalExploratoryDroppers = variations.reduce((s, v) => s + v.exploratoryDroppers, 0);

  const data = {
    labels: [
      "Decisive Installers (<=7s)",
      "Exploratory Installers (>7s)",
      "Decisive Droppers (<=7s)",
      "Exploratory Droppers (>7s)",
    ],
    datasets: [
      {
        data: [totalDecisive, totalExploratory, totalDecisiveDroppers, totalExploratoryDroppers],
        backgroundColor: [
          "rgba(34, 197, 94, 0.8)",
          "rgba(59, 130, 246, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(251, 146, 60, 0.8)",
        ],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" as const },
      title: { display: true, text: "Installer Behavior (Decisive vs Exploratory)" },
    },
  };

  return <Doughnut data={data} options={options} />;
}
