import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { createIncidentLink, triggerAppEvent } from "./front.js";
import { buildIncidentUrl } from "./statuspage.js";
import { StatuspageWebhookPayloadSchema } from "./statuspage.types.js";

const app = new Hono();

app.post(
  "/event",
  zValidator("json", StatuspageWebhookPayloadSchema),
  async (c) => {
    const payload = c.req.valid("json");
    // Not an incident update - ignore
    if (!payload.incident) {
      return c.body(null, 204);
    }

    // Likely a new incident - Create a new Incident Link
    // You may want to add more logic here to handle other incident statuses
    if (payload.incident.status === "investigating") {
      await createIncidentLink({
        name: payload.incident.name,
        external_url: buildIncidentUrl(payload),
      });
      return c.body(null, 204);
    }

    const eventType =
      payload.incident.status === "resolved"
        ? "status_resolved"
        : ("status_updated" as const);

    // Else we're safe to assume this was an incident status update
    await triggerAppEvent({
      event_type: eventType,
      app_object: {
        ext_link: buildIncidentUrl(payload),
      },
    });

    // Return 204 OK
    return c.body(null, 204);
  },
);

app.onError((err, c) => {
  console.error(`${err}`);
  return c.text("Internal Server Error", 500);
});

export default app;
