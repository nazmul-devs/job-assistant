export const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 JobAssistantPro/1.0";

export async function fetchWithTimeout(
  url: string,
  options: {
    timeoutMs?: number;
    headers?: Record<string, string>;
  } = {}
): Promise<Response> {
  const { timeoutMs = 15000, headers = {} } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": DEFAULT_USER_AGENT,
        Accept: "application/json, application/xml, text/xml, */*",
        ...headers,
      },
    });

    return response;
  } finally {
    clearTimeout(timer);
  }
}
