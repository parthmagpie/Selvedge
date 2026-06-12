import type { Page } from "@playwright/test";

export async function blockAnalytics(page: Page) {
  await page.route("**/ingest/**", (route) => route.abort());
}

export interface CapturedEvent {
  event: string;
  properties: Record<string, unknown>;
}

export async function captureAnalytics(page: Page): Promise<CapturedEvent[]> {
  const events: CapturedEvent[] = [];
  await page.route("**/ingest/**", async (route) => {
    try {
      const body = route.request().postDataJSON();
      if (body?.batch) {
        for (const item of body.batch) {
          if (item.event) events.push({ event: item.event, properties: item.properties || {} });
        }
      } else if (body?.event) {
        events.push({ event: body.event, properties: body.properties || {} });
      }
    } catch { /* non-JSON body, ignore */ }
    await route.abort(); // still block from reaching provider
  });
  return events;
}

export async function checkNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  if (overflow) {
    throw new Error(
      `Horizontal overflow detected (scrollWidth ${await page.evaluate(() => document.documentElement.scrollWidth)}px > clientWidth ${await page.evaluate(() => document.documentElement.clientWidth)}px)`
    );
  }
}
