import { expect, test } from "@playwright/test";

test.describe("mobile UI", () => {
  test("home page uses sunlit classroom theme and stacked cards", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator("body")).toHaveCSS(
      "background-color",
      "rgb(246, 233, 210)",
    );

    const heroTitle = page.locator(".hero-title");
    await expect(heroTitle).toBeVisible();
    const heroFont = await heroTitle.evaluate(
      (el) => getComputedStyle(el).fontFamily,
    );
    expect(heroFont).toContain("Playfair Display");

    const gridColumns = await page
      .locator(".card-grid")
      .evaluate((el) => getComputedStyle(el).gridTemplateColumns);
    expect(gridColumns.trim().split(" ").length).toBe(1);

    const cardBox = await page
      .locator(".experiment-card")
      .first()
      .boundingBox();
    expect(cardBox?.height ?? 0).toBeGreaterThanOrEqual(44);
  });

  test("MediaPipe control bar stays mobile-friendly", async ({ page }) => {
    await page.goto("/mediapipe.html");

    const controlBar = page.locator(".control-bar");
    await expect(controlBar).toBeVisible();
    await expect(controlBar).toHaveCSS("position", "sticky");
    await expect(controlBar).toHaveCSS("bottom", "0px");

    const controlsDirection = await page
      .locator(".controls")
      .evaluate((el) => getComputedStyle(el).flexDirection);
    expect(controlsDirection).toBe("column");

    const buttonBox = await page
      .locator(".controls button")
      .first()
      .boundingBox();
    expect(buttonBox?.height ?? 0).toBeGreaterThanOrEqual(44);
  });

  test("Control Center shows responsive empty state", async ({ page }) => {
    await page.goto("/control-center.html");

    const emptyState = page.locator(".empty-state");
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toHaveCSS(
      "background-color",
      "rgb(255, 243, 226)",
    );

    const statusWrap = await page
      .locator(".status-row")
      .evaluate((el) => getComputedStyle(el).flexWrap);
    expect(statusWrap).toBe("wrap");
  });
});
