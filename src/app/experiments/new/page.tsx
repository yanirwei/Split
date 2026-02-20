"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface VariationForm {
  name: string;
  isControl: boolean;
  title: string;
  subtitle: string;
  description: string;
  shortDescription: string;
  iconUrl: string;
  videoUrl: string;
  screenshotUrls: string[];
}

export default function NewExperiment() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: App details
  const [appName, setAppName] = useState("");
  const [developer, setDeveloper] = useState("");
  const [storeType, setStoreType] = useState<"ios" | "android">("ios");
  const [category, setCategory] = useState("");
  const [appRating, setAppRating] = useState("4.5");
  const [appReviewCount, setAppReviewCount] = useState("1000");
  const [appSize, setAppSize] = useState("");

  // Step 2: Experiment details
  const [expName, setExpName] = useState("");
  const [expDescription, setExpDescription] = useState("");
  const [testingElement, setTestingElement] = useState("icon");
  const [trafficSplit, setTrafficSplit] = useState("50/50");
  const [fbPixelId, setFbPixelId] = useState("");
  const [targetSampleSize, setTargetSampleSize] = useState("1000");

  // Step 3: Variations
  const [variations, setVariations] = useState<VariationForm[]>([
    {
      name: "Control",
      isControl: true,
      title: "",
      subtitle: "",
      description: "",
      shortDescription: "",
      iconUrl: "",
      videoUrl: "",
      screenshotUrls: [],
    },
    {
      name: "Variant A",
      isControl: false,
      title: "",
      subtitle: "",
      description: "",
      shortDescription: "",
      iconUrl: "",
      videoUrl: "",
      screenshotUrls: [],
    },
  ]);

  const uploadFile = async (file: File, type: string): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    return data.url;
  };

  const handleIconUpload = async (idx: number, file: File) => {
    const url = await uploadFile(file, "icon");
    updateVariation(idx, "iconUrl", url);
  };

  const handleScreenshotUpload = async (idx: number, files: FileList) => {
    const urls: string[] = [...variations[idx].screenshotUrls];
    for (let i = 0; i < files.length; i++) {
      const url = await uploadFile(files[i], "screenshot");
      urls.push(url);
    }
    updateVariation(idx, "screenshotUrls", urls);
  };

  const handleVideoUpload = async (idx: number, file: File) => {
    const url = await uploadFile(file, "video");
    updateVariation(idx, "videoUrl", url);
  };

  const updateVariation = (idx: number, field: keyof VariationForm, value: string | string[] | boolean) => {
    setVariations((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v))
    );
  };

  const addVariation = () => {
    const letter = String.fromCharCode(65 + variations.length - 1);
    setVariations((prev) => [
      ...prev,
      {
        name: `Variant ${letter}`,
        isControl: false,
        title: "",
        subtitle: "",
        description: "",
        shortDescription: "",
        iconUrl: "",
        videoUrl: "",
        screenshotUrls: [],
      },
    ]);
  };

  const removeVariation = (idx: number) => {
    if (variations.length <= 2) return;
    setVariations((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: expName,
          description: expDescription,
          testingElement,
          trafficSplit,
          fbPixelId: fbPixelId || undefined,
          targetSampleSize: parseInt(targetSampleSize),
          appName,
          developer,
          storeType,
          category,
          rating: parseFloat(appRating),
          reviewCount: parseInt(appReviewCount),
          appSize,
          variations: variations.map((v) => ({
            name: v.name,
            isControl: v.isControl,
            title: v.title || appName,
            subtitle: v.subtitle || undefined,
            description: v.description || undefined,
            shortDescription: v.shortDescription || undefined,
            iconUrl: v.iconUrl || undefined,
            videoUrl: v.videoUrl || undefined,
            screenshotUrls: v.screenshotUrls.length > 0 ? v.screenshotUrls : undefined,
          })),
        }),
      });
      const data = await res.json();
      router.push(`/experiments/${data.id}`);
    } catch (error) {
      console.error("Failed to create experiment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const testingElements = [
    { value: "icon", label: "Icon" },
    { value: "screenshots", label: "Screenshots" },
    { value: "video", label: "Video" },
    { value: "title", label: "Title" },
    { value: "subtitle", label: "Subtitle" },
    { value: "description", label: "Description" },
    { value: "short_description", label: "Short Description" },
    { value: "first_impression", label: "First Impression (FG)" },
    { value: "multiple", label: "Multiple Elements" },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Experiment</h1>
      <p className="text-gray-500 mb-8">Set up an A/B test for your app store page</p>

      {/* Step Indicator */}
      <div className="flex items-center gap-4 mb-8">
        {[
          { num: 1, label: "App Details" },
          { num: 2, label: "Experiment Setup" },
          { num: 3, label: "Variations" },
        ].map(({ num, label }) => (
          <div key={num} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= num
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {num}
            </div>
            <span
              className={`text-sm font-medium ${
                step >= num ? "text-blue-600" : "text-gray-400"
              }`}
            >
              {label}
            </span>
            {num < 3 && <div className="w-12 h-px bg-gray-300" />}
          </div>
        ))}
      </div>

      {/* Step 1: App Details */}
      {step === 1 && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-6">App Details</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="label">App Name *</label>
              <input
                type="text"
                className="input-field"
                placeholder="My Amazing App"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Developer *</label>
              <input
                type="text"
                className="input-field"
                placeholder="Developer Name"
                value={developer}
                onChange={(e) => setDeveloper(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Store Type *</label>
              <select
                className="input-field"
                value={storeType}
                onChange={(e) => setStoreType(e.target.value as "ios" | "android")}
              >
                <option value="ios">iOS App Store</option>
                <option value="android">Google Play Store</option>
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., Games, Productivity"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Rating</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                className="input-field"
                value={appRating}
                onChange={(e) => setAppRating(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Review Count</label>
              <input
                type="number"
                className="input-field"
                value={appReviewCount}
                onChange={(e) => setAppReviewCount(e.target.value)}
              />
            </div>
            <div>
              <label className="label">App Size</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., 120 MB"
                value={appSize}
                onChange={(e) => setAppSize(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={() => setStep(2)}
              disabled={!appName || !developer}
              className="btn-primary"
            >
              Next: Experiment Setup
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Experiment Setup */}
      {step === 2 && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-6">Experiment Setup</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="label">Experiment Name *</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., Icon A/B Test - Blue vs Red"
                value={expName}
                onChange={(e) => setExpName(e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="What are you testing and why?"
                value={expDescription}
                onChange={(e) => setExpDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Element to Test *</label>
              <select
                className="input-field"
                value={testingElement}
                onChange={(e) => setTestingElement(e.target.value)}
              >
                {testingElements.map((el) => (
                  <option key={el.value} value={el.value}>
                    {el.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Traffic Split</label>
              <select
                className="input-field"
                value={trafficSplit}
                onChange={(e) => setTrafficSplit(e.target.value)}
              >
                <option value="50/50">50/50 (2 variations)</option>
                <option value="33/33/34">33/33/34 (3 variations)</option>
                <option value="25/25/25/25">25/25/25/25 (4 variations)</option>
              </select>
            </div>
            <div>
              <label className="label">Facebook Pixel ID</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., 123456789"
                value={fbPixelId}
                onChange={(e) => setFbPixelId(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Used to track conversions from Facebook ads
              </p>
            </div>
            <div>
              <label className="label">Target Sample Size</label>
              <input
                type="number"
                className="input-field"
                value={targetSampleSize}
                onChange={(e) => setTargetSampleSize(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Per variation, for statistical significance
              </p>
            </div>
          </div>
          <div className="flex justify-between mt-6">
            <button onClick={() => setStep(1)} className="btn-secondary">
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!expName}
              className="btn-primary"
            >
              Next: Variations
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Variations */}
      {step === 3 && (
        <div className="space-y-6">
          {variations.map((v, idx) => (
            <div key={idx} className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">
                    {v.isControl ? "Control (Current Page)" : v.name}
                  </h3>
                  {v.isControl && (
                    <span className="badge bg-gray-100 text-gray-700">
                      Control
                    </span>
                  )}
                </div>
                {!v.isControl && variations.length > 2 && (
                  <button
                    onClick={() => removeVariation(idx)}
                    className="text-red-500 text-sm hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Variation Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={v.name}
                    onChange={(e) => updateVariation(idx, "name", e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Title</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder={appName || "App title"}
                    value={v.title}
                    onChange={(e) => updateVariation(idx, "title", e.target.value)}
                  />
                </div>
                {storeType === "ios" && (
                  <div>
                    <label className="label">Subtitle</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="iOS subtitle"
                      value={v.subtitle}
                      onChange={(e) => updateVariation(idx, "subtitle", e.target.value)}
                    />
                  </div>
                )}
                {storeType === "android" && (
                  <div>
                    <label className="label">Short Description</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Google Play short description"
                      value={v.shortDescription}
                      onChange={(e) => updateVariation(idx, "shortDescription", e.target.value)}
                    />
                  </div>
                )}
                <div className="col-span-2">
                  <label className="label">Description</label>
                  <textarea
                    className="input-field"
                    rows={3}
                    placeholder="App description"
                    value={v.description}
                    onChange={(e) => updateVariation(idx, "description", e.target.value)}
                  />
                </div>

                {/* File uploads */}
                <div>
                  <label className="label">App Icon</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="input-field text-sm"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleIconUpload(idx, e.target.files[0]);
                    }}
                  />
                  {v.iconUrl && (
                    <div className="mt-2 w-16 h-16 rounded-xl overflow-hidden">
                      <img src={v.iconUrl} alt="Icon preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {storeType === "ios" && (
                  <div>
                    <label className="label">Preview Video</label>
                    <input
                      type="file"
                      accept="video/*"
                      className="input-field text-sm"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleVideoUpload(idx, e.target.files[0]);
                      }}
                    />
                    {v.videoUrl && (
                      <p className="text-xs text-green-600 mt-1">Video uploaded</p>
                    )}
                  </div>
                )}

                <div className="col-span-2">
                  <label className="label">Screenshots</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="input-field text-sm"
                    onChange={(e) => {
                      if (e.target.files) handleScreenshotUpload(idx, e.target.files);
                    }}
                  />
                  {v.screenshotUrls.length > 0 && (
                    <div className="flex gap-2 mt-2 overflow-x-auto">
                      {v.screenshotUrls.map((url, sIdx) => (
                        <div key={sIdx} className="flex-shrink-0 w-20 h-36 rounded-lg overflow-hidden bg-gray-100">
                          <img src={url} alt={`Screenshot ${sIdx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          <button onClick={addVariation} className="btn-secondary w-full">
            + Add Another Variation
          </button>

          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="btn-secondary">
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary"
            >
              {submitting ? "Creating..." : "Create Experiment"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
