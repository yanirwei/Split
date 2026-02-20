// Client-side tracking utilities

export interface TrackingEvent {
  variationId: string;
  visitorId: string;
  eventType: string;
  metadata?: Record<string, unknown>;
  sessionDuration?: number;
}

export interface HeatmapClick {
  variationId: string;
  visitorId: string;
  x: number;
  y: number;
  elementType?: string;
}

export async function trackEvent(event: TrackingEvent): Promise<void> {
  try {
    await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "event", ...event }),
    });
  } catch (error) {
    console.error("Failed to track event:", error);
  }
}

export async function trackHeatmapClick(click: HeatmapClick): Promise<void> {
  try {
    await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "heatmap", ...click }),
    });
  } catch (error) {
    console.error("Failed to track heatmap click:", error);
  }
}

export function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "";
  let visitorId = localStorage.getItem("split_visitor_id");
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem("split_visitor_id", visitorId);
  }
  return visitorId;
}

export function initFacebookPixel(pixelId: string): void {
  if (typeof window === "undefined" || !pixelId) return;

  // Inject Facebook Pixel script
  const script = document.createElement("script");
  script.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
    fbq('track', 'PageView');
  `;
  document.head.appendChild(script);
}

export function fireFacebookEvent(eventName: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const fbq = (window as unknown as Record<string, unknown>).fbq as
    | ((...args: unknown[]) => void)
    | undefined;
  if (fbq) {
    fbq("track", eventName, params);
  }
}
