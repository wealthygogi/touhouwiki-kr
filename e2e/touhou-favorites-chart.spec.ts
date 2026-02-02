import { test, expect } from "@playwright/test";
import { execFileSync } from "child_process";
import fs from "fs";

const PAGE_PATH = "/touhouwiki-kr/docs/toy/touhou-favorites-chart";

test.describe("Touhou Favorites Chart", () => {
  test("select, reorder, portrait, preview, exports", async ({ page }) => {
    test.setTimeout(300_000);
    await page.goto(PAGE_PATH);
    await page.locator("h2", { hasText: "동방프로젝트 최애표" }).first().waitFor();

    const search = page.getByPlaceholder("검색 (한국어/일본어/영어)");

    // Select characters
    await page.getByRole("button", { name: /^캐릭터/ }).click();
    await search.fill("치르노");
    await page
      .locator("label", { hasText: "치르노" })
      .first()
      .locator("input[type=checkbox]")
      .check();

    await search.fill("레이무");
    await page
      .locator("label", { hasText: "레이무" })
      .first()
      .locator("input[type=checkbox]")
      .check();

    // Select track
    await page.getByRole("button", { name: /^OST/ }).click();
    await search.fill("U.N.");
    await page
      .locator("label", { hasText: "U.N." })
      .first()
      .locator("input[type=checkbox]")
      .check();

    // Season
    await page.getByRole("button", { name: /겨울\s*\|\s*Winter/ }).click();

    // Reorder: move character #2 up to #1
    await page.getByRole("button", { name: "move-character-2-up" }).click();

    // Edit portrait (crop modal)
    await page.getByRole("button", { name: "편집" }).click();
    const portraitDialog = page.getByRole("dialog").filter({ hasText: "Portrait 편집" });
    await expect(portraitDialog).toBeVisible();
    await portraitDialog.getByPlaceholder("캐릭터 1순위 코멘트").fill("테스트 코멘트");
    await portraitDialog.getByRole("button", { name: "Save" }).click();

    // Open preview modal
    await page.getByRole("button", { name: "Preview" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Verify 2x2 preview + portrait comment
    await expect(dialog.getByText("1. Portrait").first()).toBeVisible();
    await expect(dialog.getByText("레이무").first()).toBeVisible();
    await expect(dialog.getByText("테스트 코멘트").first()).toBeVisible();

    // CSV download
    const csvDownload = page.waitForEvent("download");
    await dialog.getByRole("button", { name: "CSV" }).click();
    const csvFile = await csvDownload;
    const csvPath = await csvFile.path();
    expect(csvPath).toBeTruthy();
    if (!csvPath) throw new Error("CSV path missing");
    const csvText = await fs.promises.readFile(csvPath, "utf-8");
    expect(csvText).toContain("kind,rank,id");

    // JSON download and verify rank + season
    const jsonDownload = page.waitForEvent("download");
    await dialog.getByRole("button", { name: "JSON" }).click();
    const jsonFile = await jsonDownload;
    const jsonPath = await jsonFile.path();
    expect(jsonPath).toBeTruthy();
    if (!jsonPath) throw new Error("JSON path missing");
    const jsonText = await fs.promises.readFile(jsonPath, "utf-8");
    expect(jsonText).toContain('"seasonId"');
    expect(jsonText).toContain('"rank"');
    expect(jsonText).toContain('"portrait"');
    expect(jsonText).toContain("\"comment\": \"테스트 코멘트\"");

    // PNG download + dimension check
    const downloadBtn = dialog.getByRole("button", { name: /PNG/ });
    await expect(downloadBtn).toBeEnabled({ timeout: 150_000 });
    const pngDownload = page.waitForEvent("download");
    await downloadBtn.click();
    const pngFile = await pngDownload;
    const pngPath = await pngFile.path();
    expect(pngPath).toBeTruthy();
    if (pngPath) {
      const output = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", pngPath]).toString();
      expect(output).toContain("pixelWidth: 3840");
      expect(output).toContain("pixelHeight: 2160");
    }
  });
});
