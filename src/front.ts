import { env } from "./env.js";
import type { components } from "./front.types.js";

type Path = `/${string}`;

/**
 * Narrow event type to only allow event types specified in your Front Application App Triggers
 * In this example, we only allow the status_updated or status_resolved event types
 */
type AppEvent = components["schemas"]["AppEvent"] & {
  event_type: "status_updated" | "status_resolved";
};

/**
 * Narrow create link type to only allow external_url
 */
type CreateIncidentLink = Omit<
  components["schemas"]["CreateLink"],
  "pattern"
> & {
  external_url: string;
};

const baseUrl = "https://api2.frontapp.com";
const MAX_RETRIES = 3;

/** Simple, minimal wrapper around the Front API */
const front = {
  headersForMethod: (method: "GET" | "PATCH" | "POST") => {
    return {
      ...(["PATCH", "POST"].includes(method) && {
        "Content-Type": "application/json",
      }),
    };
  },

  async get<T>(path: Path): Promise<T> {
    return this.request<T>("GET", path, undefined);
  },
  async patch<T>(path: Path, body: unknown): Promise<T> {
    return this.request("PATCH", path, body);
  },
  async post<T>(path: Path, body: unknown): Promise<T> {
    return this.request("POST", path, body);
  },

  async request<T>(
    method: "GET" | "PATCH" | "POST",
    path: Path,
    body: unknown,
    attempt = 0,
  ): Promise<T> {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        body: JSON.stringify(body),
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${env.FRONT_API_KEY}`,
          "User-Agent": "dugjason/front-statuspage-app-trigger",
          ...this.headersForMethod(method),
        },
      });
      if (response.ok) {
        return this.handleOkResponse(response);
      }
      // If the response is a rate limit error, retry the request with a backoff
      if (isRateLimitError(response) && attempt < MAX_RETRIES) {
        await handleRateLimitError(response);
        return this.request(method, path, body, attempt + 1);
      }
      // If the response is not a 200-299, and not a rate limit error, throw an error
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  async handleOkResponse<T>(response: Response): Promise<T> {
    const text = await response.text();
    if (text.trim().length === 0) {
      return undefined as T;
    }
    return JSON.parse(text) as T;
  },
};

/**
 * Add a random jitter to the retry-after time to avoid thundering herd effect
 * @param min - The minimum jitter value in milliseconds
 * @param max - The maximum jitter value in milliseconds
 * @returns The jitter value in milliseconds
 */
function getJitterMs(min = 50, max = 1_000) {
  return Math.floor(Math.random() * (max - min) + min);
}

/**
 * Handle a rate limit error by waiting for the retry-after time and adding a random jitter
 * @param response - The response from the API
 * @returns Void
 */
async function handleRateLimitError(response: Response) {
  const retryAfterMs =
    Number(response.headers.get("Retry-After") ?? 1) * 1_000 + getJitterMs();
  console.error(`Rate limit exceeded - retrying after ${retryAfterMs}ms`);
  await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
}

function isRateLimitError(response: Response) {
  return response.status === 429;
}

export async function triggerAppEvent(event: AppEvent) {
  return front.post(`/applications/${env.FRONT_APP_UID}/events`, event);
}

export async function createIncidentLink(data: CreateIncidentLink) {
  return front.post<components["schemas"]["LinkResponse"]>(`/links`, data);
}
