import { env } from "./env.js";
import type { StatuspageWebhookPayload } from "./statuspage.types.js";

export function buildIncidentUrl(payload: StatuspageWebhookPayload) {
  // Ensure the base URL doesn't end with a slash and incident ID doesn't start with a slash
  const cleanBaseUrl = env.STATUSPAGE_URL.replace(/\/$/, "");
  const cleanIncidentId = payload.incident?.id.replace(/^\//, "");
  if (!cleanIncidentId) {
    throw new Error("Invalid incident ID");
  }

  return `${cleanBaseUrl}/incidents/${cleanIncidentId}`;
}
