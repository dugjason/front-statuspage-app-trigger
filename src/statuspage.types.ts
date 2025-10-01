import { z } from "zod";

/**
 * Zod schema defining the shape of the webhook payload from Statuspage.
 * Note we only need to define the parts of the payload that we want to use.
 */
export const StatuspageWebhookPayloadSchema = z.object({
  page: z.object({
    id: z.string(),
  }),
  // Incident is only present for incident update events
  incident: z
    .object({
      id: z.string(),
      name: z.string(),
      status: z.string(),
    })
    .optional(),
});

export type StatuspageWebhookPayload = z.infer<
  typeof StatuspageWebhookPayloadSchema
>;
