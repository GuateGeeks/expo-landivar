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

    // Bottom-sheet overlay is present
    const bottomSheet = page.locator(".bottom-sheet");
    await expect(bottomSheet).toBeVisible();

    // Bottom-sheet is absolutely positioned (overlay, not sticky)
    await expect(bottomSheet).toHaveCSS("position", "absolute");

    // Top-bar overlay is present
    const topBar = page.locator(".top-bar");
    await expect(topBar).toBeVisible();
    await expect(topBar).toHaveCSS("position", "absolute");

    // Select element meets tap-target height
    const selectBox = await page.locator(".task-select").boundingBox();
    expect(selectBox?.height ?? 0).toBeGreaterThanOrEqual(44);
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
