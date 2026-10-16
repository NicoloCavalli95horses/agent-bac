//===================
// Import
//===================
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { apiGetTamperedHTTPevents } from "../utils/api.js";
import { config } from "../config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resultsDir = path.resolve(__dirname, "../../test");


//===================
// Class
//===================
export class TestGenerator {
  constructor(clickEvents, httpEvents, options = {}) {
    this.clickEvents = clickEvents;
    this.outputPath = options.outputPath ?? path.join(resultsDir, `generated.spec.js`);
    this.viewport = options.viewport ?? config.viewport;
    this.httpEvents = httpEvents;
    this.initUrl = options.initUrl ?? "";
  }


  async generate() {
    this.httpEvents = this.httpEvents.length ? this.httpEvents : await apiGetTamperedHTTPevents();
    const source = this.generateSource();
    await fs.writeFile(this.outputPath, source, "utf8");
    return this.outputPath;
  }


  generateSource() {
    const http = JSON.stringify(this.httpEvents, null, 2);
    const events = JSON.stringify(this.clickEvents, null, 2);
    const viewport = JSON.stringify(this.viewport);
    const initUrl = JSON.stringify(this.initUrl);

    return `
import { test, expect } from "@playwright/test";

const events = ${events};
const httpEvents = ${http};
const responseStatuses = [];

test("Feature-gating BAC test", async ({ page }) => {
  page.on("response", response => {
    responseStatuses.push(response.status());
  });

  await page.route("**/*", async (route) => {
    const request = route.request();
    const recordedEvent = httpEvents.find((event) => {
      const recorded = event.request;
      return (
      recorded.url === request.url() &&
      recorded.method === request.method() &&
      (recorded.body ?? "") === (request.postData() ?? ""));
    });

    if (!recordedEvent) {
      await route.continue();
      return;
    }

    const response = recordedEvent.response;

    await route.fulfill({
      status: response.status,
      headers: response.headers,
      body: JSON.stringify(response.body),
    });
  });

  await page.setViewportSize(${viewport});
  
  try {
    await page.goto(${initUrl}, {waitUntil: "networkidle", timeout: 60000,});
  } catch (err) {
    console.error("[NAVIGATION ERROR]");
    console.error("Name:", err.name);
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);
    throw err;
  }

  if (!events.length) { return; }

  for (const event of events) {
    const { clientX, clientY } = event.position;
    const { tag, attributes = [] } = event.target;

    // Verify that the expected element is at the click position
    const targetMatches = await page.evaluate(({ clientX, clientY, tag, attributes }) => {
      const element = document.elementFromPoint(clientX, clientY);
      if (!element) {return false;}

      const expectedTag = tag?.toLowerCase();
      const target = expectedTag ? element.closest(expectedTag) : element;
      if (!target) {return false;}

      return attributes.every(({ name, value }) => target.getAttribute(name) === value);
      },{ clientX, clientY, tag, attributes });

    expect(targetMatches,  \`Unexpected target at (\${clientX}, \${clientY})\`).toBe(true);
    await page.mouse.click(clientX, clientY);
    }
  expect(responseStatuses.some(status => status === 403), "Expected workflow to fail with at least one HTTP 403 response").toBe(true);
  });`;
  }
}
