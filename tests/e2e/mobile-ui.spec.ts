import { expect, test } from "@playwright/test";

test.describe("mobile UI", () => {
  test("home page has dark theme and stacked card grid", async ({ page }) => {
    await page.goto("/");

    // Dark background token (#0a0a0a)
    await expect(page.locator("body")).toHaveCSS(
      "background-color",
      "rgb(10, 10, 10)",
    );

    // Hero section is visible
    const heroTitle = page.locator(".hero-title");
    await expect(heroTitle).toBeVisible();

    // Font is sans-serif (no Playfair Display)
    const heroFont = await heroTitle.evaluate(
      (el) => getComputedStyle(el).fontFamily,
    );
    expect(heroFont.toLowerCase()).not.toContain("playfair");

    // Single-column grid on 390px viewport
    const gridColumns = await page
      .locator(".card-grid")
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns);
    expect(gridColumns.trim().split(" ").length).toBe(1);

    // Cards meet minimum tap-target height (44px)
    const cardBox = await page
      .locator(".experiment-card")
      .first()
      .boundingBox();
    expect(cardBox?.height ?? 0).toBeGreaterThanOrEqual(44);
  });

  test("MediaPipe page has fullscreen overlay layout", async ({ page }) => {
    await page.goto("/mediapipe.html");

    // Top-bar overlay is present
    const topBar = page.locator(".top-bar");
    await expect(topBar).toBeVisible();
    await expect(topBar).toHaveCSS("position", "absolute");

    // Carousel items are always visible (7 circular items)
    const carouselItems = page.locator(".carousel-item");
    await expect(carouselItems).toHaveCount(7);
    await expect(carouselItems.first()).toBeVisible();

    // Carousel items are circular
    await expect(carouselItems.first()).toHaveCSS("border-radius", "50%");

    // Carousel items meet tap-target size (≥44px)
    const itemBox = await carouselItems.first().boundingBox();
    expect(itemBox?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(itemBox?.width ?? 0).toBeGreaterThanOrEqual(44);

    // No task rail exists (removed)
    await expect(page.locator(".task-rail")).toHaveCount(0);

    // Record button is visible but disabled before running
    const recordButton = page.locator(".record-btn");
    await expect(recordButton).toBeVisible();
    await expect(recordButton).toBeDisabled();

    // Flip button is hidden until a task is running and cameras are detected
    await expect(page.locator('button[aria-label="Flip camera"]')).toHaveCount(
      0,
    );
  });

  test("AR.js page is mobile-first", async ({ page }) => {
    await page.goto("/arjs.html");

    const viewportMeta = await page
      .locator('meta[name="viewport"]')
      .getAttribute("content");
    expect(viewportMeta ?? "").toContain("viewport-fit=cover");

    const bodyTouch = await page
      .locator("body")
      .evaluate((el) => getComputedStyle(el).touchAction);
    expect(bodyTouch).toBe("manipulation");

    const backLinkBox = await page.locator(".overlay a").boundingBox();
    expect(backLinkBox?.height ?? 0).toBeGreaterThanOrEqual(44);
  });

  test("A-Frame placement page is mobile-first", async ({ page }) => {
    await page.goto("/aframe-placement.html");

    const viewportMeta = await page
      .locator('meta[name="viewport"]')
      .getAttribute("content");
    expect(viewportMeta ?? "").toContain("viewport-fit=cover");

    const bodyTouch = await page
      .locator("body")
      .evaluate((el) => getComputedStyle(el).touchAction);
    expect(bodyTouch).toBe("manipulation");

    const backLinkBox = await page.locator(".overlay a").boundingBox();
    expect(backLinkBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    const placeButtonBox = await page.locator("#place-button").boundingBox();
    expect(placeButtonBox?.height ?? 0).toBeGreaterThanOrEqual(44);
  });

  test("MindAR page is mobile-first", async ({ page }) => {
    await page.goto("/mindar.html");

    const viewportMeta = await page
      .locator('meta[name="viewport"]')
      .getAttribute("content");
    expect(viewportMeta ?? "").toContain("viewport-fit=cover");

    const bodyTouch = await page
      .locator("body")
      .evaluate((el) => getComputedStyle(el).touchAction);
    expect(bodyTouch).toBe("manipulation");

    const backLinkBox = await page.locator(".overlay a").boundingBox();
    expect(backLinkBox?.height ?? 0).toBeGreaterThanOrEqual(44);
  });

  test("WebXR placement page is mobile-first", async ({ page }) => {
    await page.goto("/webxr-placement.html");

    const viewportMeta = await page
      .locator('meta[name="viewport"]')
      .getAttribute("content");
    expect(viewportMeta ?? "").toContain("viewport-fit=cover");

    const bodyTouch = await page
      .locator("body")
      .evaluate((el) => getComputedStyle(el).touchAction);
    expect(bodyTouch).toBe("manipulation");

    const backLinkBox = await page.locator(".overlay a").boundingBox();
    expect(backLinkBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    const startButtonBox = await page.locator("#start-ar").boundingBox();
    expect(startButtonBox?.height ?? 0).toBeGreaterThanOrEqual(44);
  });

  test("Control Center shows dark empty state", async ({ page }) => {
    await page.goto("/control-center.html");

    // Empty state is visible
    const emptyState = page.locator(".empty-state");
    await expect(emptyState).toBeVisible();

    // Background is dark (not warm/sunlit)
    const bgColor = await page
      .locator("body")
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bgColor).toBe("rgb(10, 10, 10)");

    // No horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(390);
  });
});
